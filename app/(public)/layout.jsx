'use client'
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useDispatch } from "react-redux";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { fetchCart, uploadCart } from "@/lib/features/cart/cartSlice";
import { useSelector } from "react-redux";
import { fetchAddress } from "@/lib/features/address/addressSlice";
import { fetchUserRatings } from "@/lib/features/rating/ratingSlice";

export default function PublicLayout({ children }) {
    
    const dispatch = useDispatch()
    const {user} = useUser()
    const {getToken} = useAuth()
    const {cartItems} = useSelector((state)=>state.cart)
    const debounceRef = useRef(null)

    useEffect(()=>{
        dispatch(fetchProducts({}))
    },[])

    useEffect(()=>{
        if(user){
            dispatch(fetchCart({getToken}))
            dispatch(fetchAddress({getToken}))
            dispatch(fetchUserRatings({getToken}))
        }
    },[user])
    
    // Debounced cart upload
    useEffect(()=>{
        if(user && Object.keys(cartItems).length > 0){
            // Clear existing timeout
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
            // Set new timeout for debounced upload
            debounceRef.current = setTimeout(() => {
                dispatch(uploadCart({getToken})).catch(error => {
                    // Silently handle upload errors to prevent UI disruption
                    console.warn('Cart upload failed:', error)
                })
            }, 1000) // 1 second debounce
        }
        
        // Cleanup timeout on unmount
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    },[user, cartItems])


    return (
        <>
            <Banner />
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
