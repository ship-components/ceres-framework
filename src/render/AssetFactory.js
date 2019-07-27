module.exports = () => {
  function AssetFactory(assets) {
    return {
      forPayload() {
        return {
          js: assets.js,
          css: assets.css,
        };
      },
    };
  }

  return AssetFactory;
};
