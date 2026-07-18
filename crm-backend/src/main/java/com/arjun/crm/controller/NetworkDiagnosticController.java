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
        results.put("tests", new LinkedHashMap<>());
        
        Map<String, Object> tests = (Map<String, Object>) results.get("tests");
        
        // Create fresh OkHttpClient for diagnostic
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .build();
        
        // TEST 1: Google
        tests.put("test_1_google", performTest(client, "https://www.google.com"));
        
        // TEST 2: GitHub
        tests.put("test_2_github", performTest(client, "https://api.github.com"));
        
        // TEST 3: Supabase (extract from env, use placeholder if not set)
        String supabaseUrl = System.getenv("SUPABASE_URL");
        if (supabaseUrl == null || supabaseUrl.isEmpty()) {
            supabaseUrl = "https://db.xkzpzcvwzqjavftrnxjl.supabase.co";
        }
        String supabaseTestUrl = supabaseUrl + "/rest/v1";
        tests.put("test_3_supabase", performTest(client, supabaseTestUrl));
        
        return ResponseEntity.ok(results);
    }

    private Map<String, Object> performTest(OkHttpClient client, String url) {
        Map<String, Object> test = new LinkedHashMap<>();
        test.put("url", url);
        
        try {
            // Extract host
            String host = new java.net.URL(url).getHost();
            test.put("host", host);
            
            // DNS Resolution
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
            
            // HTTP Request
            Request request = new Request.Builder()
                    .url(url)
                    .get()
                    .build();
            
            try (Response response = client.newCall(request).execute()) {
                test.put("response_code", response.code());
                test.put("status", "SUCCESS");
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
