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
    public DbSet<TaskComment> TaskComments { get; set; }
    public DbSet<ProjectMember> ProjectMembers { get; set; }

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

        // Configure TaskComment relationships
        modelBuilder.Entity<TaskComment>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict); // don't allow deleting a user who has left comments

        modelBuilder.Entity<TaskComment>()
            .HasOne(c => c.Task)
            .WithMany()
            .HasForeignKey(c => c.TaskId)
            .OnDelete(DeleteBehavior.Cascade); // deleting a task removes its comments too

        // Configure ProjectDocument's optional links to Task and uploading User
        modelBuilder.Entity<ProjectDocument>()
            .HasOne(d => d.Task)
            .WithMany()
            .HasForeignKey(d => d.TaskId)
            .OnDelete(DeleteBehavior.SetNull); // if the task is deleted, keep the document but unlink it

        modelBuilder.Entity<ProjectDocument>()
            .HasOne(d => d.UploadedByUser)
            .WithMany()
            .HasForeignKey(d => d.UploadedByUserId)
            .OnDelete(DeleteBehavior.SetNull); // if the user is deleted, keep the document but unlink the uploader

        // Configure ProjectMember (many-to-many join between Project and User)
        modelBuilder.Entity<ProjectMember>()
            .HasOne(pm => pm.Project)
            .WithMany()
            .HasForeignKey(pm => pm.ProjectId)
            .OnDelete(DeleteBehavior.Cascade); // if a project is deleted, remove its membership records too

        modelBuilder.Entity<ProjectMember>()
            .HasOne(pm => pm.User)
            .WithMany()
            .HasForeignKey(pm => pm.UserId)
            .OnDelete(DeleteBehavior.Cascade); // if a user is deleted, remove their membership records too

        // Prevent the same user being added twice to the same project
        modelBuilder.Entity<ProjectMember>()
            .HasIndex(pm => new { pm.ProjectId, pm.UserId })
            .IsUnique();
    }
}