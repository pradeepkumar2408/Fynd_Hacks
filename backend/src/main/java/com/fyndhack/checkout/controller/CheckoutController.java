package com.fyndhack.checkout.controller;

import com.fyndhack.checkout.dto.CheckoutRequest;
import com.fyndhack.checkout.dto.CheckoutResponse;
import com.fyndhack.checkout.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final OrderService orderService;

    public CheckoutController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<CheckoutResponse> placeOrder(@Valid @RequestBody CheckoutRequest request) {
        CheckoutResponse response = orderService.processCheckout(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/order/{reference}")
    public ResponseEntity<CheckoutResponse> getOrder(@PathVariable String reference) {
        return orderService.getOrderByReference(reference)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
