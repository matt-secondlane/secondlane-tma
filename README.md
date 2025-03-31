# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```

## New Portfolio Functionality

The following functions have been added to the portfolio:

### 1. Portfolio Tabs
- **Management** - standard mode for managing portfolios and assets
- **Summary** - shows the total portfolio value, investment amount, returns, and a list of assets with their current values
- **History** - displays a graph of portfolio value changes over time

### 2. API Endpoints
- `/api/v1/portfolio/summary` - Get summary for all portfolios
- `/api/v1/portfolio/summary/graph` - Get graph data for all portfolios
- `/api/v1/portfolio/{portfolio_id}/summary` - Get summary for a specific portfolio
- `/api/v1/portfolio/{portfolio_id}/summary/graph` - Get graph data for a specific portfolio
- `/api/v1/portfolio/assets/{asset_id}/summary` - Get summary for a specific asset
- `/api/v1/portfolio/assets/{asset_id}/summary/graph` - Get graph data for a specific asset
