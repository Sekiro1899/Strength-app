module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4 : `nativewind/babel` est un PRESET (pas un plugin), et
    // babel-preset-expo doit recevoir jsxImportSource pour que className
    // soit transformé sur les composants React Native.
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
