package com.OpenCart.backend.dto;

import java.time.LocalDate;

public class OfferRequest {
    private Integer offerPercent;
    private LocalDate offerValidUntil;

    public Integer getOfferPercent() { return offerPercent; }
    public void setOfferPercent(Integer offerPercent) { this.offerPercent = offerPercent; }

    public LocalDate getOfferValidUntil() { return offerValidUntil; }
    public void setOfferValidUntil(LocalDate offerValidUntil) { this.offerValidUntil = offerValidUntil; }
}