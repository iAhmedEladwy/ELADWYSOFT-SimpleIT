import { createRoot } from "react-dom/client";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { CurrencyProvider } from './lib/currencyContext';
import App from "./App";
import "./index.css";

// Set document title
document.title = "SimpleIT | IT Asset Management";

// Add meta description for SEO
const metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = 'SimpleIT - Complete IT Asset Management System for tracking employees, assets, and support tickets with comprehensive reporting capabilities.';
document.head.appendChild(metaDescription);

// Add Open Graph tags for better social media sharing
const ogTitle = document.createElement('meta');
ogTitle.setAttribute('property', 'og:title');
ogTitle.content = 'SimpleIT | IT Asset Management';
document.head.appendChild(ogTitle);

const ogDescription = document.createElement('meta');
ogDescription.setAttribute('property', 'og:description');
ogDescription.content = 'Complete IT Asset Management System for tracking employees, assets, and support tickets with comprehensive reporting capabilities.';
document.head.appendChild(ogDescription);

const ogType = document.createElement('meta');
ogType.setAttribute('property', 'og:type');
ogType.content = 'website';
document.head.appendChild(ogType);

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </QueryClientProvider>
);
