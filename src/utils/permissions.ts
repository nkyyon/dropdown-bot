import { GuildMember, PermissionFlagsBits } from 'discord.js';

export function isAdmin(member: GuildMember): boolean {
  return member.permissions.has([
    PermissionFlagsBits.Administrator,
  ]) || member.permissions.has([
    PermissionFlagsBits.ManageChannels,
  ]) || member.permissions.has([
    PermissionFlagsBits.ManageGuild,
  ]);
}

export function checkAdminPermission(member: GuildMember): void {
  if (!isAdmin(member)) {
    throw new Error('このコマンドの実行には管理者権限が必要です');
  }
}