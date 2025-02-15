const isValidSolanaAddress = (address: string): boolean => {
    try {
      // Basic check for length
      if (address.length !== 44) return false
  
      // Check if it starts with "DezXAz" (example, adjust as needed)
      if (!address.startsWith("DezXAz")) return false
  
      // More robust checks can be added here if needed (e.g., using a Solana library)
  
      return true
    } catch (error) {
      return false
    }
  }
  
  export { isValidSolanaAddress }
  
  