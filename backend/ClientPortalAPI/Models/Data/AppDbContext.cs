using Microsoft.EntityFrameworkCore;
using ClientPortalAPI.Models;

namespace ClientPortalAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Project> Projects { get; set; }
}