package com.arjun.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import java.net.InetAddress;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * TEMPORARY DIAGNOSTIC ENDPOINT
 * Tests network connectivity to three external services
 * No authentication, no storage operations, no business logic
 */
@RestController
@RequestMapping("/debug")
@Slf4j
public class NetworkDiagnosticController {

    @GetMapping("/network")
    public ResponseEntity<Map<String, Object>> testNetwork() {
        Map<String, Object> results = new LinkedHashMap<>();
        results.put("timestamp", System.currentTimeMillis());
        
        // CHECK 1: Environment Variables
        Map<String, Object> envVars = new LinkedHashMap<>();
        String supabaseUrl = System.getenv("SUPABASE_URL");
        String supabaseServiceKey = System.getenv("SUPABASE_SERVICE_KEY");
        String supabaseAnonKey = System.getenv("SUPABASE_ANON_KEY");
        
        envVars.put("SUPABASE_URL", supabaseUrl != null ? "SET (" + supabaseUrl.length() + " chars)" : "NULL");
        envVars.put("SUPABASE_URL_value", supabaseUrl);
        envVars.put("SUPABASE_SERVICE_KEY", supabaseServiceKey != null ? "SET (" + supabaseServiceKey.length() + " chars)" : "NULL");
        envVars.put("SUPABASE_SERVICE_KEY_first_50", supabaseServiceKey != null ? supabaseServiceKey.substring(0, Math.min(50, supabaseServiceKey.length())) : "NULL");
        envVars.put("SUPABASE_ANON_KEY", supabaseAnonKey != null ? "SET (" + supabaseAnonKey.length() + " chars)" : "NULL");
        envVars.put("SUPABASE_ANON_KEY_first_50", supabaseAnonKey != null ? supabaseAnonKey.substring(0, Math.min(50, supabaseAnonKey.length())) : "NULL");
        
        results.put("env_variables", envVars);
        results.put("tests", new LinkedHashMap<>());
        
        Map<String, Object> tests = (Map<String, Object>) results.get("tests");
        
        // Create fresh OkHttpClient for diagnostic
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .build();
        
        // TEST 1: Google
        tests.put("test_1_google", performTest(client, "https://www.google.com", "GET", null));
        
        // TEST 2: GitHub
        tests.put("test_2_github", performTest(client, "https://api.github.com", "GET", null));
        
        // TEST 3: Supabase REST (simple GET - no auth)
        if (supabaseUrl == null || supabaseUrl.isEmpty()) {
            supabaseUrl = "https://db.xkzpzcvwzqjavftrnxjl.supabase.co";
        }
        String supabaseRestUrl = supabaseUrl + "/rest/v1";
        tests.put("test_3_supabase_rest_get", performTest(client, supabaseRestUrl, "GET", null));
        
        // TEST 4: Supabase Storage (simple GET - no auth)
        String supabaseStorageUrl = supabaseUrl + "/storage/v1/bucket";
        tests.put("test_4_supabase_storage_get", performTest(client, supabaseStorageUrl, "GET", null));
        
        // TEST 5: Supabase Storage with Anon Key Authorization
        Map<String, String> anonHeaders = new LinkedHashMap<>();
        if (supabaseAnonKey != null && !supabaseAnonKey.isEmpty()) {
            anonHeaders.put("Authorization", "Bearer " + supabaseAnonKey);
            tests.put("test_5_supabase_storage_anon_auth", performTestWithHeaders(client, supabaseStorageUrl, "GET", anonHeaders));
        } else {
            Map<String, Object> noKeyTest = new LinkedHashMap<>();
            noKeyTest.put("status", "SKIPPED");
            noKeyTest.put("reason", "SUPABASE_ANON_KEY is NULL");
            tests.put("test_5_supabase_storage_anon_auth", noKeyTest);
        }
        
        // TEST 5b: Supabase Storage with Service Key Authorization
        Map<String, String> serviceKeyHeaders = new LinkedHashMap<>();
        if (supabaseServiceKey != null && !supabaseServiceKey.isEmpty()) {
            serviceKeyHeaders.put("Authorization", "Bearer " + supabaseServiceKey);
            tests.put("test_5b_supabase_storage_service_key", performTestWithHeaders(client, supabaseStorageUrl, "GET", serviceKeyHeaders));
        } else {
            Map<String, Object> noKeyTest = new LinkedHashMap<>();
            noKeyTest.put("status", "SKIPPED");
            noKeyTest.put("reason", "SUPABASE_SERVICE_KEY is NULL");
            tests.put("test_5b_supabase_storage_service_key", noKeyTest);
        }
        
        // TEST 6: Supabase Health check endpoint
        String healthUrl = supabaseUrl + "/api/v1/health";
        tests.put("test_6_supabase_health", performTest(client, healthUrl, "GET", null));
        
        return ResponseEntity.ok(results);
    }

    private Map<String, Object> performTest(OkHttpClient client, String url, String method, Map<String, String> headers) {
        Map<String, Object> test = new LinkedHashMap<>();
        test.put("url", url);
        test.put("method", method);
        
        try {
            String host = new java.net.URL(url).getHost();
            test.put("host", host);
            
            try {
                InetAddress[] addresses = InetAddress.getAllByName(host);
                if (addresses.length > 0) {
                    test.put("resolved_ip", addresses[0].getHostAddress());
                } else {
                    test.put("resolved_ip", "UNKNOWN");
                }
            } catch (Exception dnsEx) {
                test.put("resolved_ip", null);
                test.put("dns_error", dnsEx.getClass().getSimpleName() + ": " + dnsEx.getMessage());
                return test;
            }
            
            Request.Builder builder = new Request.Builder().url(url);
            
            if (headers != null) {
                for (Map.Entry<String, String> header : headers.entrySet()) {
                    builder.addHeader(header.getKey(), header.getValue());
                }
            }
            
            Request request = builder.get().build();
            
            try (Response response = client.newCall(request).execute()) {
                test.put("response_code", response.code());
                test.put("status", "SUCCESS");
                test.put("has_body", response.body() != null && response.body().contentLength() > 0);
            }
            
        } catch (java.net.UnknownHostException dnsEx) {
            test.put("status", "DNS_ERROR");
            test.put("exception_class", dnsEx.getClass().getSimpleName());
            test.put("exception_message", dnsEx.getMessage());
        } catch (Exception ex) {
            test.put("status", "ERROR");
            test.put("exception_class", ex.getClass().getSimpleName());
            test.put("exception_message", ex.getMessage());
        }
        
        return test;
    }

    private Map<String, Object> performTestWithHeaders(OkHttpClient client, String url, String method, Map<String, String> headers) {
        Map<String, Object> test = new LinkedHashMap<>();
        test.put("url", url);
        test.put("method", method);
        
        try {
            String host = new java.net.URL(url).getHost();
            test.put("host", host);
            
            try {
                InetAddress[] addresses = InetAddress.getAllByName(host);
                if (addresses.length > 0) {
                    test.put("resolved_ip", addresses[0].getHostAddress());
                } else {
                    test.put("resolved_ip", "UNKNOWN");
                }
            } catch (Exception dnsEx) {
                test.put("resolved_ip", null);
                test.put("dns_error", dnsEx.getClass().getSimpleName() + ": " + dnsEx.getMessage());
                return test;
            }
            
            Request.Builder builder = new Request.Builder().url(url);
            
            if (headers != null) {
                for (Map.Entry<String, String> header : headers.entrySet()) {
                    builder.addHeader(header.getKey(), header.getValue());
                }
            }
            
            Request request = builder.get().build();
            
            try (Response response = client.newCall(request).execute()) {
                test.put("response_code", response.code());
                test.put("status", "SUCCESS");
                test.put("has_body", response.body() != null && response.body().contentLength() > 0);
            }
            
        } catch (java.net.UnknownHostException dnsEx) {
            test.put("status", "DNS_ERROR");
            test.put("exception_class", dnsEx.getClass().getSimpleName());
            test.put("exception_message", dnsEx.getMessage());
        } catch (Exception ex) {
            test.put("status", "ERROR");
            test.put("exception_class", ex.getClass().getSimpleName());
            test.put("exception_message", ex.getMessage());
        }
        
        return test;
    }
}
