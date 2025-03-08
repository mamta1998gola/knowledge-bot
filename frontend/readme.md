#### Frontend
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

````
frontend/
├── public/                  # Static files
│   ├── index.html           # HTML template
│   ├── favicon.ico          # Favicon
│   └── assets/              # Static assets (images, fonts)
│
├── src/                     # Source code
│   ├── components/          # Reusable components
│   │   ├── chat/            # Chat-related components
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── ChatInput.tsx
│   │   │
│   │   ├── admin/           # Admin dashboard components
│   │   │   ├── UnansweredList.tsx
│   │   │   ├── AnswerForm.tsx
│   │   │   └── AdminStats.tsx
│   │   │
│   │   └── common/          # Common UI components
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       ├── Loader.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── pages/               # Page components
│   │   ├── ChatPage.tsx     # Main chat interface
│   │   ├── AdminPage.tsx    # Admin dashboard
│   │   └── NotFoundPage.tsx # 404 page
│   │
│   ├── services/            # API and service integrations
│   │   ├── api.ts           # API client
│   │   ├── chatService.ts   # Chat functionality
│   │   ├── fileService.ts   # File upload handling
│   │   └── adminService.ts  # Admin functionality
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useChat.ts
│   │   └── useAuth.ts
│   │
│   ├── context/             # React context providers
│   │   ├── AuthContext.tsx
│   │   └── ChatContext.tsx
│   │
│   ├── types/               # TypeScript type definitions
│   │   ├── chat.ts
│   │   ├── user.ts
│   │   └── api.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   ├── styles/              # Global styles
│   │   ├── theme.ts         # Theme configuration
│   │   └── global.css       # Global CSS
│   │
│   ├── App.tsx              # Main application component
│   ├── index.tsx            # Entry point
│   └── routes.tsx           # Route definitions
│
├── .env                     # Environment variables
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation
````