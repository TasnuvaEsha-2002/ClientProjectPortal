using Microsoft.EntityFrameworkCore;
using ClientPortalAPI.Models;

namespace ClientPortalAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Project> Projects { get; set; }
    public DbSet<TaskItem> Tasks { get; set; }
    public DbSet<Milestone> Milestones { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<ProjectDocument> Documents { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure the optional Task -> AssignedUser relationship.
        // Without this, EF Core can get confused about how to link them,
        // since User doesn't have a "Tasks" collection pointing back.
        modelBuilder.Entity<TaskItem>()
            .HasOne(t => t.AssignedUser)
            .WithMany()
            .HasForeignKey(t => t.AssignedUserId)
            .OnDelete(DeleteBehavior.SetNull); // if the user is deleted, just unassign the task instead of deleting it
    }
}