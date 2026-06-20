using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class Lokacija : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JerseyNumber",
                table: "Users");

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Leagues",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Leagues",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Leagues");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Leagues");

            migrationBuilder.AddColumn<int>(
                name: "JerseyNumber",
                table: "Users",
                type: "int",
                nullable: true);
        }
    }
}
