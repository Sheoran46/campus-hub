package com.sheoran.LostAndFound.service.services;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    // Fixed listing fee is 10 Rupees
    private static final int LISTING_FEE_INR = 10;

    public String createOrder(String userEmail) throws RazorpayException {
        RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);

        JSONObject orderRequest = new JSONObject();
        // Amount must be in paise (10 Rupees = 1000 paise)
        orderRequest.put("amount", LISTING_FEE_INR * 100); 
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "listing_fee_" + System.currentTimeMillis());

        Order order = razorpay.orders.create(orderRequest);
        return order.toString(); // Return JSON string of the order to frontend
    }

    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            return Utils.verifySignature(payload, signature, keySecret);
        } catch (RazorpayException e) {
            return false;
        }
    }
}