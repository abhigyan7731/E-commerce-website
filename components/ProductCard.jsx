'use client'
import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const ProductCard = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    // calculate the average rating of the product
    const rating = Math.round(product.rating.reduce((acc, curr) => acc + curr.rating, 0) / product.rating.length);

    return (
        <div className='group max-xl:mx-auto max-w-60'>
            <Link href={`/product/${product.id}`}>
                <div className='bg-[#F5F5F5] h-40  sm:w-60 sm:h-68 rounded-lg flex items-center justify-center'>
                    {product.images && product.images[0] && product.images[0].trim() !== "" ? (
                        <Image width={500} height={500} className='max-h-30 sm:max-h-40 w-auto group-hover:scale-115 transition duration-300' src={product.images[0]} alt="" />
                    ) : (
                        <div className="max-h-30 sm:max-h-40 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">No Image</div>
                    )}
                </div>
                <div className='flex justify-between gap-3 text-sm text-slate-800 pt-2'>
                    <div>
                        <p>{product.name}</p>
                        <div className='flex'>
                            {Array(5).fill('').map((_, index) => (
                                <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                            ))}
                        </div>
                    </div>
                    <p>{currency}{product.price}</p>
                </div>
            </Link>
            {product.store?.username && (
                <div className='mt-1 text-xs text-slate-500'>
                    <Link href={`/shop/${product.store.username}`} className='hover:underline'>
                        View seller: @{product.store.username}
                    </Link>
                </div>
            )}
        </div>
    )
}

export default ProductCard