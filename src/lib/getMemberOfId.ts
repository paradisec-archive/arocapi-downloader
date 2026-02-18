// The API may return memberOf as either a string ID or an EntityRef object {id, name}
export const getMemberOfId = (memberOf: string | { id: string } | undefined): string | undefined => {
  if (!memberOf) {
    return undefined;
  }

  if (typeof memberOf === 'string') {
    return memberOf;
  }

  return memberOf.id;
};
