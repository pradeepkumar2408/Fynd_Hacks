package com.fyndhack.checkout.config;

import com.fyndhack.checkout.model.Product;
import com.fyndhack.checkout.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(ProductRepository productRepository) {
        return args -> {
            if (productRepository.count() == 0) {
                Product p1 = new Product(
                        "AuraSound ANC Wireless Headphones",
                        "High-fidelity audio with active noise cancellation, premium memory foam ear cushions, and 40-hour battery life.",
                        new BigDecimal("99.99"),
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"
                );

                Product p2 = new Product(
                        "ErgoPro Precision Wireless Mouse",
                        "Ergonomic contoured design with ultra-fast scroll wheel, whisper-quiet switches, and dual Bluetooth connectivity.",
                        new BigDecimal("29.99"),
                        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80"
                );

                productRepository.saveAll(List.of(p1, p2));
                System.out.println(">>> Initialized 2 synthetic products in database successfully.");
            }
        };
    }
}
