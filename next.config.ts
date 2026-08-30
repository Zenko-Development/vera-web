import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              // Явно указываем, что хотим дефолтный экспорт
              exportType: 'default',
              // Оптимизация через SVGO
              svgo: true,
              // Убираем фиксированные размеры, чтобы можно было контролировать через CSS
              svgoConfig: {
                plugins: [
                  'preset-default',
                  {
                    name: 'removeViewBox',
                    active: false, // Сохраняем viewBox для масштабирования
                  },
                ],
              },
            },
          },
        ],
        as: '*.js',
      },
    },
  },
  images: {
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;