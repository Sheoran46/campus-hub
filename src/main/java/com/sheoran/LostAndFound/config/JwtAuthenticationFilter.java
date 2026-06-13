package com.sheoran.LostAndFound.config;

import com.sheoran.LostAndFound.repositories.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Enumeration;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private static final Logger filterLogger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        filterLogger.info("--- Incoming Request: {} {} ---", request.getMethod(), request.getRequestURI());
        
        try {
            String jwt = jwtUtils.getJwtFromHeader(request);
            
            if (jwt != null) {
                filterLogger.info("JWT Token found in request header");
                
                if (jwtUtils.validateJwtToken(jwt)) {
                    String username = jwtUtils.getUsernameFromToken(jwt);
                    filterLogger.info("Token is valid for user: {}", username);

                    UserDetails userDetails = userRepository.findByEmail(username)
                            .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities());

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    filterLogger.info("Authentication set successfully in SecurityContext. Authorities: {}", userDetails.getAuthorities());
                } else {
                    filterLogger.warn("JWT Token is invalid or expired.");
                }
            } else {
                filterLogger.info("No JWT Token found in Authorization header.");
                // Log all headers to see what's actually coming in
                Enumeration<String> headerNames = request.getHeaderNames();
                while (headerNames.hasMoreElements()) {
                    String headerName = headerNames.nextElement();
                    filterLogger.debug("Header - {}: {}", headerName, request.getHeader(headerName));
                }
            }
        } catch (Exception e) {
            filterLogger.error("Cannot set user authentication: {}", e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }
}