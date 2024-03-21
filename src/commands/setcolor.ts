import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import Color from "color";

@ApplyOptions<Command.Options>({
  name: "setcolor",
  description: "Set your RGB coloaaar",
})
export class PingCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder //
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((_) => {
          return _.setRequired(true)
            .setName("color")
            .setDescription("The hex color to set your role to");
        })
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    // return interaction.reply({ content: "Hello world!" });
    const raw = interaction.options.getString("color") ?? "";
    let color = null;
    try {
      color = Color(raw);
    } catch (e) {
      return interaction.reply({
        embeds: [
          { color: 0xff4646, title: "Error", description: "Invalid color!" },
        ],
        ephemeral: true,
      });
    }
    if (color == null) return;

    const guild = await interaction.guild?.fetch();
    if (guild == undefined) return;

    const member = await interaction.guild?.members.fetch(interaction.user.id);
    let currentColorRole = member?.roles.cache.find(
      (role) => role.name.startsWith("#") && role.name.length == 7
    );

    if (currentColorRole) {
      member?.roles.remove(currentColorRole);
      if (currentColorRole.members.size == 1) {
        guild.roles.delete(currentColorRole);
      }
    }

    let roleToAdd = guild.roles.cache.find(
      (role) => role.name.toUpperCase() == color.hex().toUpperCase()
    );
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
              title: "Error",
              description:
                "There was an error creating the role! Make sure there's room to make a role, and that the bot has permission to make roles.",
            },
          ],
          ephemeral: true,
        });
      }
    }

    member?.roles.add(roleToAdd);

    return interaction.reply({
      embeds: [
        {
          color: color.rgbNumber(),
          title: "Success",
          description: `Set your role color to ${color.hex().toUpperCase()}`,
        },
      ],
    });
    // if (color.)
  }
}
