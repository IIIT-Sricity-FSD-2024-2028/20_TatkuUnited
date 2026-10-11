import CartItem from "./CartItem";

function CartList({ items, onRemoveItem }: any) {
    return (
        <div className="cart-items">
            {items.map((item: any) => (
                <CartItem
                    key={item.id}
                    item={item}
                    onRemoveItem={onRemoveItem}
                />
            ))}
        </div>
    );
}

export default CartList;