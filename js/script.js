// ================================
// API URL
// ================================
const REVIEWS_API = 'https://jsonplaceholder.typicode.com/comments';
const CART_API = 'https://flower-design-api.free.beeceptor.com/cart';

let cart = []; // Масив для зберігання товарів у кошику

// ================================
// Завантаження відгуків з API (GET)
// ================================
async function loadReviews() {
    try {
        // Відправка GET-запиту на API відгуків, обмежуємо 3 відгуками
        let res = await fetch(REVIEWS_API + '?_limit=3');
        let reviews = await res.json();

        // Виводимо відгуки в консоль для демонстрації на захисті
        console.log("Завантажені відгуки:", reviews);

        let section = document.querySelector('section[aria-label="Відгуки клієнтів"]');
        let h2 = section.querySelector('h2');

        // Створюємо карточки для кожного відгуку
        reviews.forEach((rev, i) => {
            let art = document.createElement("article");
            let photo = i % 2 === 0 ? "img/reviews-photo1.png" : "img/reviews-photo2.png";

            art.innerHTML = `
                <figure><img src="${photo}" alt="Фото клієнта"></figure>
                <blockquote>
                    <p>"${rev.body}"</p>
                    <p>${rev.email}, <time>${new Date().toLocaleDateString('uk-UA')}</time></p>
                </blockquote>
            `;

            // Вставляємо відгук після заголовку секції
            h2.after(art);
        });

    } catch (err) {
        console.error("Помилка при завантаженні відгуків:", err);
    }
}

// ================================
// Додавання нового відгуку (POST)
// ================================
document.querySelector(".review-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Отримуємо дані з форми
    let name = document.querySelector("#review-name").value.trim();
    let text = document.querySelector("#review-text").value.trim();

    if (!name || !text) {
        alert("Заповніть усі поля!");
        return;
    }

    try {
        // Відправляємо POST-запит на сервер
        let res = await fetch(REVIEWS_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                body: text,
                email: name + "@example.com"
            })
        });

        let data = await res.json();

        // Виводимо створений відгук у консоль для демонстрації
        console.log("Доданий новий відгук:", data);

        let section = document.querySelector('section[aria-label="Відгуки клієнтів"]');
        let h2 = section.querySelector('h2');

        let art = document.createElement("article");
        art.innerHTML = `
            <figure><img src="img/reviews-photo2.png" alt="Ваше фото"></figure>
            <blockquote>
                <p>"${data.body}"</p>
                <p>${data.name}, <time>${new Date().toLocaleDateString('uk-UA')}</time></p>
            </blockquote>
        `;

        // Додаємо новий відгук на сторінку
        h2.after(art);

        // Очищаємо форму
        document.querySelector(".review-form").reset();
        alert("Відгук успішно додано!");

    } catch (err) {
        console.error("Помилка відправки відгуку:", err);
        alert("Помилка відправки відгуку");
    }
});

// ================================
// Завантаження кошика (GET)
// ================================
async function loadCart() {
    try {
        let res = await fetch(CART_API);
        let data = await res.json();

        // Беремо масив товарів з відповіді сервера, якщо він є
        cart = Array.isArray(data.items) ? data.items : [];

        updateCart(); // Оновлюємо лінки та лічильник кошика

        console.log("Кошик завантажено:", cart);

    } catch (err) {
        console.error("Помилка при завантаженні кошика:", err);
        cart = [];
    }
}

// ================================
// Додавання товару в кошик
// ================================
document.querySelectorAll('#catalog .btn-cart').forEach((btn, i) => {
    btn.addEventListener("click", async () => {
        let card = btn.closest("article");

        let product = {
            id: i + 1,
            name: card.querySelector("figcaption").textContent.trim(),
            price: parseInt(card.querySelector(".price").textContent),
            quantity: 1
        };

        // Якщо товар вже у кошику, збільшуємо кількість
        let exist = cart.find(p => p.id === product.id);
        exist ? exist.quantity++ : cart.push(product);

        try {
            await fetch(CART_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "add", product, cart })
            });

            console.log("Товар додано на сервер:", product);
            alert(`"${product.name}" додано до кошика!`);
        } catch {
            alert("Товар додано локально");
        }

        updateCart();
    });
});

// ================================
// Оновлення лічильника кошика
// ================================
function updateCart() {
    let count = cart.reduce((s, p) => s + p.quantity, 0);

    let link = document.querySelector("#cart-link");

    if (!link) {
        let nav = document.querySelector("header nav ul");
        let li = document.createElement("li");
        li.innerHTML = `<a href="#" id="cart-link">Кошик (0)</a>`;
        nav.appendChild(li);

        link = document.querySelector("#cart-link");
        link.addEventListener("click", (e) => {
            e.preventDefault();
            showCart();
        });
    }

    link.textContent = `Кошик (${count})`;
}

// ================================
// Показ вмісту кошика
// ================================
function showCart() {
    if (!cart.length) {
        alert("Кошик порожній");
        return;
    }

    let txt = "Ваші товари:\n\n";
    let total = 0;

    cart.forEach(p => {
        let sum = p.price * p.quantity;
        txt += `${p.name}\n${p.price} грн × ${p.quantity} = ${sum} грн\n\n`;
        total += sum;
    });

    txt += `Разом: ${total} грн`;

    if (confirm(txt + "\n\nОформити замовлення?")) {
        checkout();
    }
}

// ================================
// Оформлення замовлення
// ================================
async function checkout() {
    try {
        let total = cart.reduce((s, p) => s + p.price * p.quantity, 0);

        await fetch(CART_API + "/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: cart,
                total,
                date: new Date().toISOString()
            })
        });

        alert("Замовлення успішно оформлено!");
        cart = [];
        updateCart();

    } catch {
        alert("Помилка оформлення замовлення");
    }
}

// ================================
// Старт при завантаженні сторінки
// ================================
window.addEventListener("DOMContentLoaded", () => {
    loadReviews(); // Завантажуємо відгуки з сервера
    loadCart();    // Завантажуємо кошик
});
