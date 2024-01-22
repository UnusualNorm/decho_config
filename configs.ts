export const kv = await Deno.openKv();

export async function getConfig(
  platform: string,
  type: string,
  id: string,
): Promise<Record<string, unknown> | undefined> {
  const config = await getRawConfig(platform, type, id);
  if (!config && platform !== "default") return getConfig("default", type, id);
  else if (!config) return undefined;

  if (config.redirect) {
    const [newPlatform, newType, newId] = config.redirect;
    return getConfig(
      newPlatform || platform,
      newType || type,
      newId || id,
    );
  }

  return config;
}

export async function getRawConfig(
  platform: string,
  type: string,
  id: string,
): Promise<
  (Record<string, unknown> & {
    redirect?: [string | undefined, string | undefined, string | undefined];
  }) | undefined
> {
  const entry = await kv.get<
    Record<string, unknown> & {
      redirect?: [string | undefined, string | undefined, string | undefined];
    }
  >([platform, type, id]);

  if (!entry.value) return undefined;
  return entry.value;
}

export async function setConfig(
  platform: string,
  type: string,
  id: string,
  config: Record<string, unknown>,
): Promise<void> {
  await kv.set([platform, type, id], config);
}

export async function deleteConfig(
  platform: string,
  type: string,
  id: string,
): Promise<void> {
  await kv.delete([platform, type, id]);
}

export const listConfigs = async (): Promise<{
  platform: string;
  type: string;
  id: string;
}[]> => {
  const configs: {
    platform: string;
    type: string;
    id: string;
  }[] = [];

  for await (
    const entry of kv.list({
      prefix: [],
    })
  ) {
    const [platform, type, id] = entry.key;
    configs.push({
      platform: platform as string,
      type: type as string,
      id: id as string,
    });
  }

  return configs;
};
