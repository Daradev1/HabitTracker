import { useAuth } from '@/context/authContext';
import { account } from '@/lib/appwrite';
import NetInfo from "@react-native-community/netinfo";
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Divider, RadioButton, Snackbar } from 'react-native-paper';



interface Plan {
  id: string;
  title: string;
  price: string;
  priceValue: number; // Added numeric price value
  originalPrice?: string;
  billing?: string;
  description: string;
  benefits: string[];
}

const PricingScreen: React.FC = () => {
  const { setPlan,user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [expandedBenefit, setExpandedBenefit] = useState<string | null>(null);
  const animation = useRef(new Animated.Value(0)).current;
const [snackbarVisible, setSnackbarVisible] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState('');  const [selectedPlanDetails, setSelectedPlanDetails] = useState<Plan | null>(null);
  const plans: Plan[] = [
    {
      id: 'free',
      title: 'Free',
      price: '$0',
      priceValue: 0,
      description: 'Unlimited links and a customisable Linktree.',
      benefits: [
        'Unlimited links',
        'Basic customization',
        'Standard analytics',
        'Up to 3 social icons',
      ],
    },
    {
      id: 'monthly',
      title: 'Monthly',
      price: '$10.99 USD',
      priceValue: 10.99,
      originalPrice: '$15.99 USD',
      billing: 'Per month, billed annually',
      description: 'More customisation and control.',
      benefits: [
        'All Free features',
        'Advanced customization',
        'Enhanced analytics',
        'Up to 10 social icons',
        'Priority support',
      ],
    },
    {
      id: 'yearly',
      title: 'Yearly',
      price: '$99.99 USD',
      priceValue: 99.99,
      originalPrice: '$119.99 USD',
      billing: 'Per month, billed annually',
      description: 'More customisation and control.',
      benefits: [
        'All Free features',
        'Advanced customization',
        'Enhanced analytics',
        'Up to 10 social icons',
        'Priority support',
      ],
    },
  ];

  const toggleBenefit = (benefitId: string) => {
    if (expandedBenefit === benefitId) {
      setExpandedBenefit(null);
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      setExpandedBenefit(benefitId);
      Animated.timing(animation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    const plan = plans.find(p => p.id === planId);
    setSelectedPlanDetails(plan || null);
  };

  const handlePayment = () => {
    if (!selectedPlanDetails) return;

    if (selectedPlanDetails.priceValue === 0) {
      // Free plan selected
      handleResetUser()
      
    } else{
      // Paid plan selected - initiate payment
      console.log('Initiating payment for:', selectedPlanDetails);
      // Here you would integrate with Apple Pay/Google Pay
      // using the selectedPlanDetails.priceValue
    }
  };

  const handleResetUser = async () => {
        console.log("running");

  try {
    const net = await NetInfo.fetch();
    
    if (!net.isConnected) {
      setSnackbarMessage('Internet connection required');
      setSnackbarVisible(true);
      return;
    }

    if (user) {
      await account.deleteSession("current");
    }
    
    setPlan('free');
    router.replace('/');
  } catch (error) {
    setSnackbarMessage('Error resetting user');
    setSnackbarVisible(true);
  }
};
 
  const benefitHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <View style={styles.container}>

      <Text style={styles.header}>Get Started</Text>
  
  
    <Snackbar
      visible={snackbarVisible}
      onDismiss={() => setSnackbarVisible(false)}
      duration={3000}
      action={{
        label: 'OK',
        onPress: () => setSnackbarVisible(false),
      }}>
      {snackbarMessage}
    </Snackbar>

      <View style={styles.loginContainer}>
        <Text>Already have an account ?</Text>  
        <Button mode="text" onPress={() => router.replace('/login')}>
          Login
        </Button>  
      </View>
     
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Choose Your Plan</Text>
        {plans.map((plan) => (
          <View key={plan.id} style={styles.planContainer}>
            <TouchableOpacity 
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlan
              ]}
              onPress={() => handlePlanSelect(plan.id)}
              activeOpacity={0.8}
            >
              <View style={styles.planHeader}>
                <RadioButton.Android
                  value={plan.id}
                  status={selectedPlan === plan.id ? 'checked' : 'unchecked'}
                  onPress={() => handlePlanSelect(plan.id)}
                  color="#6200ee"
                />
                <View style={styles.planTitleContainer}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  {plan.originalPrice && (
                    <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                  )}
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>
              </View>
              
              <Text style={styles.planDescription}>{plan.description}</Text>
              
              {plan.billing && (
                <Text style={styles.billingText}>{plan.billing}</Text>
              )}
              
              <TouchableOpacity 
                style={styles.benefitsHeader}
                onPress={() => toggleBenefit(plan.id)}
              >
                <Text style={styles.benefitsTitle}>See benefits</Text>
                <Text style={styles.benefitsIcon}>
                  {expandedBenefit === plan.id ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              
              {expandedBenefit === plan.id && (
                <Animated.View style={[styles.benefitsContent, { height: benefitHeight }]}>
                  {plan.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Text style={styles.benefitText}>✓ {benefit}</Text>
                    </View>
                  ))}
                </Animated.View>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      
      <Divider style={styles.divider} />
      
      <View style={styles.paymentContainer}>
        <Button 
          mode="contained" 
          style={[
            styles.paymentButton,
            selectedPlan === 'free' && { backgroundColor: '#6200ee' }
          ]}
          labelStyle={styles.paymentButtonText}
          icon={selectedPlan !== 'free' ? (Platform.OS === 'ios' ? 'apple' : 'google') : undefined}
          onPress={handlePayment}
        >
          {selectedPlan === 'free' ? 'Continue with Free Plan' : 
           Platform.OS === 'ios' ? 'Pay with Apple Pay' : 'Pay with Google Pay'}
        </Button>
        
        {selectedPlan !== 'free' && Platform.OS === 'android' && (
          <Button 
            mode="outlined" 
            style={styles.alternatePaymentButton}
            labelStyle={styles.alternatePaymentButtonText}
            onPress={() => console.log('Debit card selected')}
          >
            Pay with debit card
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom:20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  loginContainer:{
    display:'flex',
    flexDirection: "row",
    alignItems:"center",
    marginBottom: 10,
    justifyContent:"flex-end",
    gap:0
  },
  planContainer: {
    marginBottom: 15,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  selectedPlan: {
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  planTitleContainer: {
    marginLeft: 10,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
    marginTop: 2,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  billingText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  benefitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  benefitsTitle: {
    color: '#6200ee',
    fontWeight: '500',
  },
  benefitsIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  benefitsContent: {
    overflow: 'hidden',
  },
  benefitItem: {
    paddingVertical: 5,
  },
  benefitText: {
    color: '#555',
  },
  divider: {
    marginVertical: 20,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  paymentContainer: {
    marginTop: 10,
  },
  paymentButton: {
    backgroundColor: Platform.OS === 'ios' ? '#000' : '#4285F4',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 10,
  },
  paymentButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  alternatePaymentButton: {
    borderColor: '#6200ee',
    borderRadius: 8,
    paddingVertical: 10,
  },
  alternatePaymentButtonText: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
});

export default PricingScreen;