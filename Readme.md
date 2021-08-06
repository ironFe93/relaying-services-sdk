## Relaying Services SDK

This repository contains the relaying services SDK providing a way to developers to easy
work with the RIF Relay System.

### Description

This SDK provides a javascript/typescript library to easily interact with the RIF Relay System.

#### How to use it

You can use this library once you have it installed on your project. You have a few
ways to installing this dependency:

* **Use a release version:** just install this using the install command for node `npm i --save @rsksmart/relaying-services-sdk`.
* **Use the distributable directly from the repository:** modify your `package.json` file
  to add this line `"@rsksmart/relaying-services-sdk": "https://github.com/JONAF2103/relaying-services-sdk",`
* **Use the development version directly from your changes:** clone this repository next to your project and modify your `package.json` file
  to add this line `"@rsksmart/relaying-services-sdk": "../relaying-services-sdk",`
  
After you install the library you can import the RelayingServices interface and the DefaultRelayingServices implementation
to start using the SDK.

### How to develop

1. Clone this repository using `git clone https://github.com/JONAF2103/relaying-services-sdk.git`
2. Install it using `npm install`
3. Run `npm run switchPostInstall enable` to enable post install hooks and run again `npm install`
4. Make your changes and after all the tests and checks are ok you can run `npm run dist` to generate a distributable version
5. Push your new version into a new branch and create a PR

#### How to generate a new distributable version

1. Bump the version on the `package.json` file.
2. Commit and push any changes included the bump.

#### For Github

1. Run `npm pack` to generate the tarball to be publish as release on github.
2. Generate a new release on github and upload the generated tarball.

#### For NPM

1. Run `npm login` to login to your account on npm registry.
2. Run `npm publish` to generate the distributable version for NodeJS

#### For direct use

1. Run `npm run dist` to generate the distributable version.
2. Commit and push the dist folder with the updated version to the repository on master.


#### Husky and linters

We use husky to check linters and code styles on commits, if you commit your
changes and the commit fails on lint or prettier checks you can use these command
to check and fix the errors before trying to commit again:

* `npm run lint`: to check linter bugs
* `npm run lint:fix`: to fix linter bugs
* `npm run prettier`: to check codestyles errors
* `npm run prettier:fix`: to fix codestyles errors

