# Docker Service Templates

This repository contains the Docker Service Templates for [Smoothy](https://smoothy.cloud).

## Testing

The JavaScript Testing framework [Jest](https://jestjs.io/) is used to provide an easy way to test the correctness of the service templates.

In order to test a service template, you can add a `tests/test.ts` file to the directory of the service template. You can then add your testing logic to make sure that the service template is syntactically correct and works as expected.

To run the tests, you first need to install the npm dependencies of the tests:

```
npm install
```

Then run the tests of the specific template:

```
npx jest templates/<template>
```

Or run the tests of all the templates at once:

```
npx jest
```