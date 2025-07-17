import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_API_KEY = process.env.GOOGLE_VISION_API_KEY!

export async function POST(req: NextRequest) {
  const { image } = await req.json()

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
          { type: 'LABEL_DETECTION', maxResults: 3 }, // fallback
        ],
      },
    ],
  }

  try {
    const response = await fetch(visionEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const json = await response.json()
    const annotations = json.responses?.[0]

    if (!annotations) throw new Error('Réponse vide ou invalide')

    // 🧠 Préférence pour webDetection
    const webLabels = annotations.webDetection?.bestGuessLabels?.map((l: any) => l.label)
    const fallbackLabels = annotations.labelAnnotations?.map((l: any) => l.description)

    return NextResponse.json({
      labels: webLabels?.length ? webLabels : fallbackLabels || [],
      logos: annotations.logoAnnotations?.map((l: any) => l.description) || [],
      objects: annotations.localizedObjectAnnotations?.map((o: any) => o.name) || [],
      text: annotations.fullTextAnnotation?.text || '',
    })
  } catch (error) {
    console.error('Erreur analyse Vision API:', error)
    return NextResponse.json({ error: 'Erreur Google Vision' }, { status: 500 })
  }
}
