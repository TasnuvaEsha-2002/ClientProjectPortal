using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClientPortalAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentTaskAndUploader : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TaskId",
                table: "Documents",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UploadedByUserId",
                table: "Documents",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Documents_TaskId",
                table: "Documents",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_UploadedByUserId",
                table: "Documents",
                column: "UploadedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Tasks_TaskId",
                table: "Documents",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Users_UploadedByUserId",
                table: "Documents",
                column: "UploadedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Tasks_TaskId",
                table: "Documents");

            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Users_UploadedByUserId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_TaskId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_UploadedByUserId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "TaskId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "UploadedByUserId",
                table: "Documents");
        }
    }
}
