const { Toolkit } = require('actions-toolkit');
const { execSync } = require('child_process');

// Change working directory if user defined PACKAGEJSON_DIR
if (process.env.PACKAGEJSON_DIR) {
  process.env.GITHUB_WORKSPACE = `${process.env.GITHUB_WORKSPACE}/${process.env.PACKAGEJSON_DIR}`;
  process.chdir(process.env.GITHUB_WORKSPACE);
}

// Run your GitHub Action!
Toolkit.run(async (tools) => {
  const pkg = tools.getPackageJSON();
  const event = tools.context.payload;

  const messages = event.commits.map((commit) => commit.message + '\n' + commit.body);

  const isNoop = messages.map(message => message.toLowerCase().includes('skip-uprev')).includes(true);
  if (isNoop) {
    tools.exit.success('Skipping Uprev!');
    return;
  }
  const commitMessage = 'version bump to';
  const isVersionBump = messages.map((message) => message.toLowerCase().includes(commitMessage)).includes(true);
  if (isVersionBump) {
    tools.exit.success('No action necessary!');
    return;
  }

  let version = 'patch';
  if (messages.map((message) => message.toLowerCase().startsWith('feat:')).includes(true)) {
    version = 'minor';
  }

  try {
    const current = pkg.version.toString();
    console.log(process.env.username);
    console.log(process.env.email);
    console.log(process.env['tag-revision']);
    // set git user
    await tools.exec(`git config user.name "${process.env.username || process.env.GITHUB_USER || 'Automated Version Bump'}"`);
    await tools.exec(`git config user.email "${process.env.email || process.env.GITHUB_EMAIL || 'gh-action-bump-version@users.noreply.github.com'}"`);

    const currentBranch = /refs\/[a-zA-Z]+\/(.*)/.exec(process.env.GITHUB_REF)[1];
    console.log('currentBranch:', currentBranch);

    // do it in the current checked out github branch (DETACHED HEAD)
    // important for further usage of the package.json version
    await tools.exec(`npm version --allow-same-version=true --git-tag-version=false ${current}`);
    console.log('current:', current, '/', 'version:', version);
    let newVersion = execSync(`npm version --git-tag-version=false ${version}`).toString().trim();
    await tools.exec(`git commit -am "ci: ${commitMessage} ${newVersion}"`);

    // now go to the actual branch to perform the same versioning
    await tools.exec(`git checkout ${currentBranch}`);
    await tools.exec(`npm version --allow-same-version=true --git-tag-version=false ${current}`);
    console.log('current:', current, '/', 'version:', version);
    newVersion = execSync(`npm version --git-tag-version=false ${version}`).toString().trim();
    newVersion = `${process.env['INPUT_TAG-PREFIX']}${newVersion}`;
    console.log('new version:', newVersion);

    if (process.env['tag-revision'] === 'true') {
      await tools.exec(`git tag ${newVersion}`);
      await tools.exec(`git push --follow-tags`);
      await tools.exec(`git push --tags`);
    } else {
      await tools.exec(`git push`);
    } 
  } catch (e) {
    tools.log.fatal(e);
    tools.exit.failure('Failed to bump version');
  }
  tools.exit.success('Version bumped!');
});
