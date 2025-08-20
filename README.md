# TODO: use wallet0 or it's hash instead of seed phrase hash,

# Run the project
Install deps
```sh
# to intall deps with npm
npm i 
# to intall deps with yarn
yarn
```

Run dev mode for webapp
```sh
npm run dev
# or
yarn dev
```

Rin dev mode for extension if needed
```sh
npm run dev:extension
# or 
yarn dev:extension
```

You can build it as a webapp or browser extension
```sh
npm run build:prod # web app
npm run build:extension:prod # extension
```

Tests was not finished

## Description 

For bootstrap it uses `npx create-react-router@latest` from React Router which has references at React docs https://react.dev/learn/creating-a-react-app#react-router-v7 

First I used Argon2 for seed encyption but next switched to PBKDF2 because it's a part of node.js crypto.
In addition Argon2 is good but it uses WASM which it not 100% audited.
App uses window.crypto if it's possible.
Password to encrypt the seed stored as hash.

User are able to create new wallet with new seed phrase, and the wallet with the same seed but with other deriviation path.

I use salt for each encryption to make it harder to use rainbow tables.


App is client-side only.

I tried to make app blockchain agnistic so it's easy to add other chains.

Node engine: I use node v23.6.0 and npm 10.9.2. Didn't added that to the package.json engine.