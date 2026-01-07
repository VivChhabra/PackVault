# PackVault

PackVault is a web application built to help Pokémon card collectors and vendors manage their collections, organize binders, and log trades in a clear and structured way.

The idea for PackVault came from observing how many collectors and card show vendors track their cards and trades informally — often using notes apps, spreadsheets, or memory. We wanted to explore what a more purpose-built digital tool could look like, one that treats card collecting and trading as an ongoing system rather than a static list.

## Why We Built This

For collectors, it’s common to separate cards into different binders based on sets, rarity, or personal preference. For vendors, keeping track of incoming and outgoing trades — and being able to look back at them later — can be just as important as tracking inventory.

PackVault was designed around these use cases:
- Organizing cards into multiple binders
- Searching cards visually rather than by raw text
- Logging trades so users can review past activity
- Estimating card value to provide context during trades

The project intentionally focuses on usability and product thinking rather than building a fully monetized marketplace.

## Current Features

- Search Pokémon cards by name and view card images
- Add cards to a personal collection
- Organize cards into custom binders
- Create and log trades (incoming and outgoing cards)
- Automatically update binder and trade counts
- Estimate card values with graceful fallback when live data is unavailable

## Tech Stack

- React with TypeScript
- Vite
- Tailwind CSS
- Pokémon TCG API (with local fallback dataset)
- Local storage for persistence
- Deployed on Vercel

## Live Demo

Demo: https://packvault.vercel.app  
Repository: https://github.com/VivChhabra/PackVault

## Design & Engineering Approach

The UI and feature set were planned first from a product and user-experience perspective, then implemented incrementally in code.

Because external APIs can be unreliable or unavailable, the app is designed to gracefully fall back to a local card dataset when live requests fail. This ensures the application remains usable and demonstrable even during outages — a real-world consideration when building production software.

The project also prioritizes clarity and state consistency: when a card is added to a binder or a trade is created, related counts and views update immediately.

## Work in Progress

PackVault is still evolving. Planned improvements include:
- Integrating a more robust pricing data source
- Implementing a full user authentication and login system
- Improving trade analysis and value comparison
- Refining mobile and accessibility support

This project is being used both as a learning experience and as a portfolio piece to explore the intersection of product design and frontend engineering.

## Running Locally

```bash
npm install
npm run dev
