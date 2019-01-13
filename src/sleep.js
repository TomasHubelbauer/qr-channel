export default async function sleep(timeout) {
  await new Promise(resolve => window.setTimeout(resolve, timeout));
}
