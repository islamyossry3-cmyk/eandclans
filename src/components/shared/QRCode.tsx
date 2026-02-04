import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
}

export function QRCode({ value, size = 256, level = 'M' }: QRCodeProps) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg inline-block">
      <QRCodeSVG value={value} size={size} level={level} />
    </div>
  );
}
