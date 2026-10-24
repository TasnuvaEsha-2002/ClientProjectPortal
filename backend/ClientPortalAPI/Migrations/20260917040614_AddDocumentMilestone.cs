using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClientPortalAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentMilestone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MilestoneId",
                table: "Documents",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Documents_MilestoneId",
                table: "Documents",
                column: "MilestoneId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Milestones_MilestoneId",
                table: "Documents",
                column: "MilestoneId",
                principalTable: "Milestones",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Milestones_MilestoneId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_MilestoneId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "MilestoneId",
                table: "Documents");
        }
    }
}
