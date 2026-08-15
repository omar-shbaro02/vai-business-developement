export interface RuleVersion {
  readonly family: string;
  readonly version: string;
}

function cloneDefinition<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function ruleVersionKey(rule: RuleVersion): string {
  if (!/^[a-z][a-z0-9-]*$/.test(rule.family))
    throw new Error("Invalid rule family");
  if (!/^\d+\.\d+\.\d+$/.test(rule.version))
    throw new Error("Rule version must be semantic x.y.z");
  return `${rule.family}/${rule.version}`;
}

export class RuleRegistry<TDefinition> {
  readonly #definitions = new Map<string, Readonly<TDefinition>>();

  register(rule: RuleVersion, definition: TDefinition): string {
    const key = ruleVersionKey(rule);
    if (this.#definitions.has(key))
      throw new Error(`Rule version already registered: ${key}`);
    this.#definitions.set(key, Object.freeze(cloneDefinition(definition)));
    return key;
  }

  get(key: string): Readonly<TDefinition> {
    const definition = this.#definitions.get(key);
    if (!definition) throw new Error(`Unknown rule version: ${key}`);
    return cloneDefinition(definition);
  }
}

export interface VersionedResult<T> {
  readonly ruleVersion: string;
  readonly calculatedAt: string;
  readonly result: Readonly<T>;
}

export function createVersionedResult<T>(
  ruleVersion: string,
  calculatedAt: string,
  result: T,
): VersionedResult<T> {
  return Object.freeze({
    ruleVersion,
    calculatedAt,
    result: Object.freeze(cloneDefinition(result)),
  });
}
