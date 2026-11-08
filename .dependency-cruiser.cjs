/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Cấm các vòng lặp phụ thuộc lồng nhau (Circular Dependencies)',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'types-cannot-import-components',
      severity: 'error',
      comment: 'Thư mục types/ không được phép import ngược từ components/',
      from: {
        path: '^src/types',
      },
      to: {
        path: '^src/components',
      },
    },
    {
      name: 'utils-cannot-import-components',
      severity: 'error',
      comment: 'Thư mục utils/ không được phụ thuộc vào components/',
      from: {
        path: '^src/utils',
      },
      to: {
        path: '^src/components',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.app.json',
    },
  },
};
