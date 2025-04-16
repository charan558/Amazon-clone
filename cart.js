document.addEventListener("DOMContentLoaded", () => {
    const plusBtn = document.querySelector(".plus");
    const minusBtn = document.querySelector(".minus");
    const qtySpan = document.querySelector(".qty");
    const subtotalSpan = document.getElementById("subtotal");

    let quantity = 1;
    const price = 9499;

    plusBtn.addEventListener("click", () => {
        quantity++;
        updateCart();
    });

    minusBtn.addEventListener("click", () => {
        if (quantity > 1) {
            quantity--;
            updateCart();
        }
    });

    function updateCart() {
        qtySpan.textContent = quantity;
        subtotalSpan.textContent = `₹${(price * quantity).toLocaleString()}.00`;
    }
});

