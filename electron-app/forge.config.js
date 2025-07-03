module.exports = {
  packagerConfig: {
    name: 'ConcoreNews Desktop',
    icon: './icon.png',
    executableName: 'concore-news',
    asar: true,
    ignore: [
      /node_modules/,
      /\.git/,
      /\.vscode/,
      /out/,
      /\.DS_Store/
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'concore-news'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {}
    }
  ]
}; 