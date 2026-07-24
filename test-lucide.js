try {
  const lucide = require('lucide-react-native');
  console.log('Lucide exports count:', Object.keys(lucide).length);
  console.log('Has ShieldCheck:', 'ShieldCheck' in lucide);
  console.log('Has ArrowRight:', 'ArrowRight' in lucide);
  console.log('Has HelpCircle:', 'HelpCircle' in lucide);
  console.log('Has CheckCircle:', 'CheckCircle' in lucide);
} catch (e) {
  console.error('Error requiring lucide:', e);
}
