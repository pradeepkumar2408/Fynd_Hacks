package com.fyndhack.checkout.service;

import com.fyndhack.checkout.dto.CheckoutRequest;
import com.fyndhack.checkout.dto.CheckoutResponse;
import com.fyndhack.checkout.dto.OrderItemRequest;
import com.fyndhack.checkout.dto.OrderItemResponse;
import com.fyndhack.checkout.model.Order;
import com.fyndhack.checkout.model.OrderItem;
import com.fyndhack.checkout.model.Product;
import com.fyndhack.checkout.repository.OrderRepository;
import com.fyndhack.checkout.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final Map<String, CheckoutResponse> idempotencyCache = new ConcurrentHashMap<>();

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public CheckoutResponse processCheckout(CheckoutRequest request) {
        // Idempotency check if key provided
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            CheckoutResponse cached = idempotencyCache.get(request.getIdempotencyKey());
            if (cached != null) {
                return cached;
            }
        }

        // Validate customer name
        if (request.getCustomerName() == null || request.getCustomerName().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer name is required");
        }

        // Validate items
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart cannot be empty");
        }

        BigDecimal calculatedTotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();
        List<OrderItemResponse> responseItems = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            if (itemReq.getProductId() == null) {
                throw new IllegalArgumentException("Product ID is required for each item");
            }
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new IllegalArgumentException("Quantity must be greater than zero");
            }

            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + itemReq.getProductId()));

            BigDecimal unitPrice = product.getPrice().setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            calculatedTotal = calculatedTotal.add(lineTotal);

            OrderItem orderItem = new OrderItem(
                    product.getId(),
                    product.getName(),
                    unitPrice,
                    itemReq.getQuantity(),
                    lineTotal
            );
            orderItems.add(orderItem);

            responseItems.add(new OrderItemResponse(
                    product.getId(),
                    product.getName(),
                    unitPrice,
                    itemReq.getQuantity(),
                    lineTotal
            ));
        }

        // Generate unique order reference e.g., ORD-782415
        String orderReference = generateUniqueOrderReference();

        Order order = new Order(
                orderReference,
                request.getCustomerName().trim(),
                request.getCustomerEmail() != null ? request.getCustomerEmail().trim() : null,
                calculatedTotal.setScale(2, RoundingMode.HALF_UP),
                "CONFIRMED",
                LocalDateTime.now()
        );

        for (OrderItem item : orderItems) {
            order.addItem(item);
        }

        Order savedOrder = orderRepository.save(order);

        CheckoutResponse response = new CheckoutResponse(
                savedOrder.getOrderReference(),
                savedOrder.getCustomerName(),
                savedOrder.getCustomerEmail(),
                savedOrder.getTotalAmount(),
                savedOrder.getStatus(),
                savedOrder.getCreatedAt(),
                responseItems,
                "Order placed successfully!"
        );

        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            idempotencyCache.put(request.getIdempotencyKey(), response);
        }

        return response;
    }

    public Optional<CheckoutResponse> getOrderByReference(String reference) {
        return orderRepository.findByOrderReference(reference).map(order -> {
            List<OrderItemResponse> itemResponses = order.getItems().stream()
                    .map(item -> new OrderItemResponse(
                            item.getProductId(),
                            item.getProductName(),
                            item.getUnitPrice(),
                            item.getQuantity(),
                            item.getLineTotal()
                    ))
                    .toList();

            return new CheckoutResponse(
                    order.getOrderReference(),
                    order.getCustomerName(),
                    order.getCustomerEmail(),
                    order.getTotalAmount(),
                    order.getStatus(),
                    order.getCreatedAt(),
                    itemResponses,
                    "Order found"
            );
        });
    }

    private String generateUniqueOrderReference() {
        String ref;
        do {
            int randomNum = 100000 + new Random().nextInt(900000);
            ref = "ORD-" + randomNum;
        } while (orderRepository.findByOrderReference(ref).isPresent());
        return ref;
    }
}
