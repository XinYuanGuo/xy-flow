import axios from "axios";
import semver from "semver";
import urlJoin from "url-join";

export async function getNpmInfo(npmName) {
  if (!npmName) {
    return null;
  }
  const registry = "https://registry.npmjs.org";
  const npmInfoUrl = urlJoin(registry, npmName);
  const res = await axios.get(npmInfoUrl);
  if (res.status === 200) {
    return res.data;
  }
}

async function getNpmVersions(npmName) {
  const data = await getNpmInfo(npmName);
  if (data) {
    return Object.keys(data.versions);
  } else {
    return [];
  }
}

/**
 * 获取大于当前版本的版本号
 * @param {*} baseVersion
 * @param {*} versions
 * @returns
 */
function getSatisfiesVersions(baseVersion, versions) {
  return versions
    .filter((version) => semver.satisfies(version, `>${baseVersion}`))
    .sort((a, b) => (semver.gt(b, a) ? 1 : -1));
}

/**
 * 通过npm api获取大于当前版本的最新的版本号
 * @param {*} baseVersion 当前包版本
 * @param {*} npmName 包名
 * @returns 最新版本号
 */
export async function getNpmSatisfiesVersion(baseVersion, npmName) {
  const versions = await getNpmVersions(npmName);
  const newVersions = getSatisfiesVersions(baseVersion, versions);
  if (newVersions && newVersions.length > 0) {
    return newVersions[0];
  }
  return null;
}

/**
 * 通过npm api获取最新版本号
 * @param {*} npmName 包名
 * @returns 最新版本号
 */
export async function getNpmLatestVersion(npmName) {
  let versions = await getNpmVersions(npmName);
  if (versions) {
    return versions.sort((a, b) => semver.gt(b, a))[versions.length - 1];
  }
  return null;
}
