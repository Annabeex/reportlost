'use client';

type Props = { title: string };

export default function ShareButton({ title }: Props) {
  const onClick = () => {
    if (navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied!');
    }
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center rounded-lg bg-[#226638] text-white px-5 py-2.5 font-semibold shadow hover:brightness-110"
    >
      Share this report
    </button>
  );
}
