module.exports = {
    plugins: {
      'postcss-preset-mantine': {},
      'postcss-simple-vars': {
        /* Vite's build-time CSS url() rewriting injects __VITE_ASSET__<id>__
           placeholders whose Rollup reference ids may contain "$" (seen with
           the @fontsource/m-plus-rounded-1c subset files). Without `silent`,
           simple-vars treats that as an undefined $variable and fails the
           build; with it, unknown $tokens pass through while the defined
           breakpoint variables below still substitute normally. */
        silent: true,
        variables: {
          'mantine-breakpoint-xs': '36em',
          'mantine-breakpoint-sm': '48em',
          'mantine-breakpoint-md': '62em',
          'mantine-breakpoint-lg': '75em',
          'mantine-breakpoint-xl': '88em',
        },
      },
    },
  };