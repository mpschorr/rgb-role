import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import Color from 'color';
import { Role } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'setcolor',
	description: 'Set your RGB coloaaar',
})
export class PingCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((_) => {
					return _.setRequired(true).setName('color').setDescription('The hex color to set your role to');
				}),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const raw = interaction.options.getString('color') ?? '';
		const color = this.getColor(interaction, raw);
		if (!color) return;

		try {
			// Fetch guild
			const guild = await interaction.guild?.fetch();
			if (!guild) return;

			// Gets the member
			const member = guild.members.cache.get(interaction.user.id) ?? (await guild.members.fetch(interaction.user.id));
			if (!member) return;
			const currentColorRole = member.roles.cache.find((role) => role.name.startsWith('#') && role.name.length === 7);
			if (currentColorRole) {
				member.roles.remove(currentColorRole);
				this.deleteIfUnused(currentColorRole);
			}

			// Checks role permissions
			const me = guild.members.me ?? (await guild.members.fetchMe());
			if (!me.permissions.has('ManageRoles')) {
				return interaction.reply({
					embeds: [
						{
							color: 0xff4646,
							title: 'Error',
							description: 'The bot must have permission to manage roles.',
						},
					],
					ephemeral: true,
				});
			}

			// Add existing role, or create if cannot
			let roleToAdd = guild.roles.cache.find((role) => role.name.toUpperCase() === color.hex().toUpperCase());
			if (!roleToAdd) {
				try {
					roleToAdd = await guild.roles.create({
						name: color.hex().toUpperCase(),
						color: color.rgbNumber(),
					});
				} catch (e) {
					return interaction.reply({
						embeds: [
							{
								color: 0xff4646,
								title: 'Error',
								description: "There was an error creating the role! Make sure there's room to make a role.",
							},
						],
						ephemeral: true,
					});
				}
			}
			member.roles.add(roleToAdd);

			// Success embed
			return interaction.reply({
				embeds: [
					{
						color: color.rgbNumber(),
						title: 'Success',
						description: `Set your role color to ${color.hex().toUpperCase()}`,
					},
				],
				ephemeral: true,
			});
		} catch (e) {
			return interaction.reply({
				embeds: [
					{
						color: 0xff4646,
						title: 'Error',
						description: 'There was an unknown error! Check console output.',
					},
				],
				ephemeral: true,
			});
		}
	}

	getColor(interaction: Command.ChatInputCommandInteraction, raw: string) {
		let color = null;
		try {
			color = Color(raw);
		} catch (e) {
			interaction.reply({
				embeds: [{ color: 0xff4646, title: 'Error', description: 'Invalid color!' }],
				ephemeral: true,
			});
			return;
		}
		if (color == null) return;
		return color;
	}

	deleteIfUnused(role: Role) {
		if (role.members.size === 1) {
			role.guild.roles.delete(role);
		}
	}
}
