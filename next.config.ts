import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    const assetRule = config.module.rules.find(
      (rule: { test?: { test?: (value: string) => boolean } }) =>
        rule.test?.test?.("icon.svg"),
    );

    if (assetRule && typeof assetRule === "object") {
      assetRule.exclude = /\.svg$/i;
    }

    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });

    return config;
  },
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
