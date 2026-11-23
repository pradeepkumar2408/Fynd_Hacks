package com.fyndhack.checkout.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class CheckoutRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    private String customerEmail;

    @NotEmpty(message = "Cart cannot be empty")
    @Valid
    private List<OrderItemRequest> items;

    // Optional client submission token to enforce idempotency on backend as well
    private String idempotencyKey;

    public CheckoutRequest() {
    }

    public CheckoutRequest(String customerName, String customerEmail, List<OrderItemRequest> items, String idempotencyKey) {
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.items = items;
        this.idempotencyKey = idempotencyKey;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }
}
