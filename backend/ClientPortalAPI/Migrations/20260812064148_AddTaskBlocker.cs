using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClientPortalAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskBlocker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BlockerReason",
                table: "Tasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsBlocked",
                table: "Tasks",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlockerReason",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "IsBlocked",
                table: "Tasks");
        }
    }
}
