Forked from https://github.com/phips28/gh-action-bump-version

Changes made to update dependencies and allow for using a separate access token with permission
to push to protected branches.

## Usage
```yml
name: 'Bump Version'

on:
  push:
    branches:
      - 'master'

jobs:
  bump-version:
    name: 'Bump Version on master'
    runs-on: ubuntu-latest

    steps:
      - name: 'Checkout source code'
        uses: 'actions/checkout@v2'
        with:
          ref: ${{ github.ref }}
          token: ${{ secrets.BAMBEE_BOT_WORKFLOW_TOKEN }} # required so that the checkout context has the correct permissions
      - name: 'Setup Node.js'
        uses: 'actions/setup-node@v1'
        with:
          node-version: 12
      - name: 'Automated Version Bump'
        uses: 'BambeeHR/github-actions/uprev@master'
        with:
          tag-prefix: ''
          email: 'github@bambee.com'
          username: 'bambee-bot'
          # tag-revision: true # set this so that the uprev also creates a git tag.
        env:
          GITHUB_TOKEN: ${{ secrets.BAMBEE_BOT_WORKFLOW_TOKEN }}
      - name: 'cat package.json'
        run: cat ./package.json
```

## skipping
A git commit message or body containing `skip-uprev` will not bump the revision.