import ProductDetails from "@/components/products/ProductDetails";

export default async function ProductPage({ params }) {
    const { id } = await params;

    return <ProductDetails productId={id} />;
}