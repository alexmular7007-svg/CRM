package com.arjun.crm.util;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Runtime Database Diagnostics - Verifies database connection and data integrity
 * REQUIREMENT: Print proof of which database is being used and what data exists
 */
public class DatabaseDiagnostics {
    
    public static void main(String[] args) {
        String url = "jdbc:postgresql://db.xkzpzcvwzqjavftrnxjl.supabase.co:5432/postgres?sslmode=require";
        String user = "postgres";
        String password = "TASKFLOWCRM@#12345";
        
        System.out.println("\n");
        System.out.println("╔═══════════════════════════════════════════════════════════════════════════════╗");
        System.out.println("║                    PRODUCTION RUNTIME DIAGNOSTICS                              ║");
        System.out.println("║              Database Connection & Data Integrity Verification                 ║");
        System.out.println("╚═══════════════════════════════════════════════════════════════════════════════╝");
        System.out.println();
        System.out.println("Timestamp: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS")));
        System.out.println();
        
        try {
            Class.forName("org.postgresql.Driver");
            
            // STEP 1: Print Configuration
            System.out.println("═══════════════════════════════════════════════════════════════════════════════");
            System.out.println("STEP 1: APPLICATION CONFIGURATION");
            System.out.println("═══════════════════════════════════════════════════════════════════════════════");
            System.out.println("Active Spring Profile: " + System.getenv("SPRING_PROFILES_ACTIVE"));
            System.out.println("Database URL: " + url);
            System.out.println("Database Username: " + user);
            System.out.println("Database Driver: org.postgresql.Driver");
            System.out.println();
            
            try (Connection conn = DriverManager.getConnection(url, user, password)) {
                
                // STEP 2: Verify Connection
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                System.out.println("STEP 2: DATABASE CONNECTION VERIFICATION");
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                DatabaseMetaData metaData = conn.getMetaData();
                System.out.println("✓ Connection Status: ACTIVE");
                System.out.println("Database Product: " + metaData.getDatabaseProductName());
                System.out.println("Database Version: " + metaData.getDatabaseProductVersion());
                System.out.println("JDBC Driver: " + metaData.getDriverName() + " v" + metaData.getDriverVersion());
                System.out.println("Current Schema: postgres");
                System.out.println();
                
                // STEP 3: All Workspaces
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                System.out.println("STEP 3: ALL WORKSPACES IN DATABASE");
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                queryAllWorkspaces(conn);
                System.out.println();
                
                // STEP 4: Global Data Counts
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                System.out.println("STEP 4: GLOBAL DATA COUNTS (ALL WORKSPACES)");
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                executeGlobalCountQueries(conn);
                System.out.println();
                
                // STEP 5: Data Distribution by Workspace
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                System.out.println("STEP 5: DATA DISTRIBUTION BY WORKSPACE");
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                executeDistributionQueries(conn);
                System.out.println();
                
                // STEP 6: Workspace 11 Specific Analysis
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                System.out.println("STEP 6: WORKSPACE 11 - DETAILED ANALYSIS");
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                analyzeWorkspace11(conn);
                System.out.println();
                
                // STEP 7: All Leads Query
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                System.out.println("STEP 7: CHECKING ALL TABLES EXISTENCE");
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                checkTableExistence(conn);
                System.out.println();
                
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
                System.out.println("DIAGNOSTICS COMPLETE");
                System.out.println("═══════════════════════════════════════════════════════════════════════════════");
            }
        } catch (ClassNotFoundException e) {
            System.err.println("❌ PostgreSQL driver not found: " + e.getMessage());
            e.printStackTrace();
        } catch (SQLException e) {
            System.err.println("❌ Database error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static void queryAllWorkspaces(Connection conn) throws SQLException {
        String sql = "SELECT id, name, owner_id, created_at FROM workspaces ORDER BY id;";
        System.out.println("Query: " + sql);
        System.out.println();
        
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            System.out.printf("%-5s %-40s %-10s %-30s\n", "ID", "Name", "Owner ID", "Created At");
            System.out.println("─────────────────────────────────────────────────────────────────────────────────");
            
            boolean found = false;
            while (rs.next()) {
                found = true;
                System.out.printf("%-5d %-40s %-10d %-30s\n",
                    rs.getInt("id"),
                    rs.getString("name"),
                    rs.getInt("owner_id"),
                    rs.getTimestamp("created_at")
                );
            }
            
            if (!found) {
                System.out.println("(No workspaces found)");
            }
        }
    }
    
    private static void executeGlobalCountQueries(Connection conn) throws SQLException {
        System.out.println("Query 1: SELECT COUNT(*) FROM leads;");
        executeSingleCountQuery(conn, "SELECT COUNT(*) as count FROM leads;", "Lead");
        
        System.out.println("Query 2: SELECT COUNT(*) FROM projects;");
        executeSingleCountQuery(conn, "SELECT COUNT(*) as count FROM projects;", "Project");
        
        System.out.println("Query 3: SELECT COUNT(*) FROM tasks;");
        executeSingleCountQuery(conn, "SELECT COUNT(*) as count FROM tasks;", "Task");
        
        System.out.println("Query 4: SELECT COUNT(*) FROM lead_magnets;");
        executeSingleCountQuery(conn, "SELECT COUNT(*) as count FROM lead_magnets;", "Lead Magnet");
        
        System.out.println();
    }
    
    private static void executeSingleCountQuery(Connection conn, String sql, String tableName) throws SQLException {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            if (rs.next()) {
                long count = rs.getLong("count");
                System.out.println("  → Total " + tableName + " records: " + count);
            }
        } catch (SQLException e) {
            System.out.println("  ❌ Error: " + e.getMessage());
        }
    }
    
    private static void executeDistributionQueries(Connection conn) throws SQLException {
        System.out.println("Distribution by Workspace - LEADS:");
        String leadSql = "SELECT workspace_id, COUNT(*) as count FROM leads GROUP BY workspace_id ORDER BY workspace_id;";
        executeDistributionQuery(conn, leadSql);
        
        System.out.println("\nDistribution by Workspace - PROJECTS:");
        String projectSql = "SELECT workspace_id, COUNT(*) as count FROM projects GROUP BY workspace_id ORDER BY workspace_id;";
        executeDistributionQuery(conn, projectSql);
        
        System.out.println("\nDistribution by Workspace - TASKS:");
        String taskSql = "SELECT workspace_id, COUNT(*) as count FROM tasks GROUP BY workspace_id ORDER BY workspace_id;";
        executeDistributionQuery(conn, taskSql);
    }
    
    private static void executeDistributionQuery(Connection conn, String sql) throws SQLException {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            System.out.printf("%-15s %-15s\n", "Workspace ID", "Count");
            System.out.println("─────────────────────────────────────");
            
            boolean found = false;
            while (rs.next()) {
                found = true;
                System.out.printf("%-15d %-15d\n",
                    rs.getInt("workspace_id"),
                    rs.getLong("count")
                );
            }
            
            if (!found) {
                System.out.println("(No records)");
            }
        } catch (SQLException e) {
            System.out.println("❌ Error: " + e.getMessage());
        }
    }
    
    private static void analyzeWorkspace11(Connection conn) throws SQLException {
        System.out.println("Workspace 11 Basic Info:");
        String sql = "SELECT id, name, owner_id FROM workspaces WHERE id = 11;";
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            if (rs.next()) {
                System.out.println("  ✓ ID: " + rs.getInt("id"));
                System.out.println("  ✓ Name: " + rs.getString("name"));
                System.out.println("  ✓ Owner ID: " + rs.getInt("owner_id"));
            } else {
                System.out.println("  ❌ Workspace 11 NOT FOUND in database");
            }
        }
        
        System.out.println("\nWorkspace 11 Data Counts:");
        System.out.println("  Leads: " + getCountForWorkspace(conn, "leads", 11));
        System.out.println("  Projects: " + getCountForWorkspace(conn, "projects", 11));
        System.out.println("  Tasks: " + getCountForWorkspace(conn, "tasks", 11));
        System.out.println("  Lead Magnets: " + getCountForWorkspace(conn, "lead_magnets", 11));
    }
    
    private static long getCountForWorkspace(Connection conn, String table, long workspaceId) throws SQLException {
        String sql = "SELECT COUNT(*) as count FROM " + table + " WHERE workspace_id = ?;";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, workspaceId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getLong("count");
                }
            }
        } catch (SQLException e) {
            // Handle error silently
            return -1;
        }
        return 0;
    }
    
    private static void checkTableExistence(Connection conn) throws SQLException {
        DatabaseMetaData metaData = conn.getMetaData();
        String[] tableNames = {"leads", "projects", "tasks", "lead_magnets", "workspaces", "users", "workspace_members"};
        
        System.out.println("Table Existence Check:");
        System.out.printf("%-20s %-15s\n", "Table Name", "Status");
        System.out.println("─────────────────────────────────────");
        
        for (String tableName : tableNames) {
            try (ResultSet tables = metaData.getTables(null, "public", tableName, new String[]{"TABLE"})) {
                if (tables.next()) {
                    System.out.printf("%-20s %-15s\n", tableName, "✓ EXISTS");
                } else {
                    System.out.printf("%-20s %-15s\n", tableName, "❌ MISSING");
                }
            }
        }
    }
}
