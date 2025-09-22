import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_API_KEY = process.env.GOOGLE_VISION_API_KEY!

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()

    if (!image) {
      return NextResponse.json({ error: 'Image manquante' }, { status: 400 })
    }

    const visionEndpoint = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`

    const requestBody = {
      requests: [
        {
          image: { content: image },
          features: [
            { type: 'WEB_DETECTION', maxResults: 3 },
            { type: 'TEXT_DETECTION' },
            { type: 'LOGO_DETECTION', maxResults: 5 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
            { type: 'LABEL_DETECTION', maxResults: 3 },
          ],
        },
      ],
    }

    const response = await fetch(visionEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      cache: 'no-store', // ❌ pas de cache sur appel direct à Google
    })

    if (!response.ok) {
      console.error('Google Vision API error:', await response.text())
      return NextResponse.json({ error: 'Erreur API Vision' }, { status: 502 })
    }

    const json = await response.json()
    const annotations = json.responses?.[0]

    if (!annotations) {
      return NextResponse.json({ error: 'Réponse vide de Vision API' }, { status: 502 })
    }

    // ✅ Préférence webDetection
    const webLabels = annotations.webDetection?.bestGuessLabels?.map((l: any) => l.label)
    const fallbackLabels = annotations.labelAnnotations?.map((l: any) => l.description)

    const result = {
      labels: webLabels?.length ? webLabels : fallbackLabels || [],
      logos: annotations.logoAnnotations?.map((l: any) => l.description) || [],
      objects: annotations.localizedObjectAnnotations?.map((o: any) => o.name) || [],
      text: annotations.fullTextAnnotation?.text || '',
    }

    // ✅ Ajout d’un cache côté CDN (utile si un même fichier est analysé plusieurs fois)
    const res = NextResponse.json(result)
    res.headers.set('Cache-Control', 's-maxage=86400, stale-while-revalidate=600')
    return res
  } catch (error) {
    console.error('Erreur analyse Vision API:', error)
    return NextResponse.json({ error: 'Erreur Google Vision' }, { status: 500 })
  }
}
